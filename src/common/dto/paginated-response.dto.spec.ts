import { PageMetaDto } from './paginated-response.dto.js';

describe('PageMetaDto', () => {
  describe('create', () => {
    it('returns zero pages when there are no items', () => {
      expect(PageMetaDto.create({ page: 1, limit: 20, totalItems: 0 })).toEqual(
        {
          page: 1,
          limit: 20,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      );
    });

    it('computes first, middle, and last pages', () => {
      expect(
        PageMetaDto.create({ page: 1, limit: 20, totalItems: 42 }),
      ).toMatchObject({
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: false,
      });

      expect(
        PageMetaDto.create({ page: 2, limit: 20, totalItems: 42 }),
      ).toMatchObject({
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });

      expect(
        PageMetaDto.create({ page: 3, limit: 20, totalItems: 42 }),
      ).toMatchObject({
        totalPages: 3,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });

    it('rounds a partial last page up', () => {
      expect(
        PageMetaDto.create({ page: 1, limit: 20, totalItems: 21 }),
      ).toMatchObject({ totalPages: 2, hasNextPage: true });
    });
  });
});
