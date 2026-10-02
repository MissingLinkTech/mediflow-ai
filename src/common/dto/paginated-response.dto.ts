import { ApiProperty } from '@nestjs/swagger';

/** Common pagination metadata. Every paginated `data` payload carries this `meta` object. */
export class PageMetaDto {
  @ApiProperty({
    description: 'Current page number, starting at 1.',
    example: 1,
  })
  page: number;

  @ApiProperty({ description: 'Items requested per page.', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total items across all pages.', example: 42 })
  totalItems: number;

  @ApiProperty({ description: 'Total pages available.', example: 3 })
  totalPages: number;

  @ApiProperty({ description: 'Whether a next page exists.', example: true })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Whether a previous page exists.',
    example: false,
  })
  hasPreviousPage: boolean;

  static create(input: {
    page: number;
    limit: number;
    totalItems: number;
  }): PageMetaDto {
    const page = Math.max(1, Math.floor(input.page));
    const limit = Math.max(1, Math.floor(input.limit));
    const totalItems = Math.max(0, Math.floor(input.totalItems));
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
    return {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}

/** Common wrapper for paginated array payloads: `{ items, meta }`. */
export class PaginatedResponseDto<TItem = unknown> {
  @ApiProperty({ description: 'Items on the current page.' })
  items: TItem[];

  @ApiProperty({ description: 'Pagination metadata.', type: PageMetaDto })
  meta: PageMetaDto;
}
