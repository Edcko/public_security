/**
 * CURP Service Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { curpService } from '@/modules/biometrics/services/curp.service';
import axios from 'axios';

vi.mock('axios');

vi.mock('@/modules/personnel/repositories/personnel.repository', () => ({
  personnelRepository: {
    findByCURP: vi.fn(),
  },
}));

import { personnelRepository } from '@/modules/personnel/repositories/personnel.repository';

describe('CURP Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.VERIFICAMEX_API_KEY = 'test-api-key';
    process.env.LLAVEMX_API_KEY = 'test-api-key';
  });

  describe('validateCURP', () => {
    it('should validate valid CURP successfully', async () => {
      const mockResponse = {
        data: {
          valid: true,
          data: {
            curp: 'BADD110312HCMLNS09',
            name: 'DIEGO',
            firstSurname: 'BARRIGA',
            secondSurname: 'DÍAZ',
            birthDate: '2011-03-12',
            gender: 'H',
            state: 'CDMX',
          },
        },
      };

      vi.mocked(axios.post).mockResolvedValueOnce(mockResponse);

      const result = await curpService.validateCURP('BADD110312HCMLNS09');

      expect(result.valid).toBe(true);
      expect(result.data?.name).toBe('DIEGO');
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('curp'),
        { curp: 'BADD110312HCMLNS09' },
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
          }),
        })
      );
    });

    it('should handle invalid CURP', async () => {
      const mockResponse = {
        data: {
          valid: false,
          errors: ['CURP inválido'],
        },
      };

      // Mock both API calls (Verificamex and LlaveMX fallback)
      vi.mocked(axios.post).mockResolvedValueOnce(mockResponse).mockResolvedValueOnce(mockResponse);

      const result = await curpService.validateCURP('INVALIDCURP');

      expect(result.valid).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(axios.post).mockRejectedValueOnce(new Error('API Error'));

      const result = await curpService.validateCURP('BADD110312HCMLNS09');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('fetchPersonByCURP', () => {
    it('should return existing person from database', async () => {
      const mockPerson = {
        id: 'person-123',
        curp: 'BADD110312HCMLNS09',
        firstName: 'Diego',
        lastName: 'Barriga',
      };

      vi.mocked(personnelRepository.findByCURP).mockResolvedValueOnce(mockPerson as any);

      const result = await curpService.fetchPersonByCURP('BADD110312HCMLNS09');

      expect(result.exists).toBe(true);
      expect(result.data).toEqual(mockPerson);
    });

    it('should fetch from API if not in database', async () => {
      const mockApiResponse = {
        data: {
          valid: true,
          data: {
            curp: 'BADD110312HCMLNS09',
            nombre: 'DIEGO',
            apellidoPaterno: 'BARRIGA',
            apellidoMaterno: 'DÍAZ',
          },
        },
      };

      vi.mocked(personnelRepository.findByCURP).mockResolvedValueOnce(null as any);
      vi.mocked(axios.post).mockResolvedValueOnce(mockApiResponse);

      const result = await curpService.fetchPersonByCURP('BADD110312HCMLNS09');

      expect(result.exists).toBe(false);
      expect(result.data).toBeDefined();
    });
  });

  describe('isValidCURPFormat', () => {
    it('should validate correct CURP format', () => {
      // CURPs válidos de 18 caracteres (formato correcto)
      expect(curpService.isValidCURPFormat('BADD110312HCMLNS09')).toBe(true);
      expect(curpService.isValidCURPFormat('LOOA531113HCLRNN06')).toBe(true);
    });

    it('should reject invalid CURP formats', () => {
      expect(curpService.isValidCURPFormat('TOOSHORT')).toBe(false);
      expect(curpService.isValidCURPFormat('TOOLONG12345678901234')).toBe(false);
      expect(curpService.isValidCURPFormat('invalid-characters!@#')).toBe(false);
      expect(curpService.isValidCURPFormat('')).toBe(false);
    });
  });
});
