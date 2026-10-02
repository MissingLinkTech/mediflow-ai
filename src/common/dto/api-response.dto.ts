import { ApiProperty } from '@nestjs/swagger';

/** Standard success envelope returned by every JSON endpoint. */
export class ApiResponseDto<TData = unknown> {
  @ApiProperty({
    description: 'Indicates the request succeeded.',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description:
      'HTTP status code echoed in the body for frontend convenience.',
    example: 200,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Human-readable message describing the outcome.',
    example: 'Resource retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description:
      'Endpoint-specific payload. Shape is defined per endpoint in Swagger via schema composition.',
    example: {},
    required: false,
    nullable: true,
  })
  data: TData | null;

  @ApiProperty({
    description: 'ISO 8601 UTC timestamp of when the response was produced.',
    example: '2026-10-02T16:10:00.000Z',
    format: 'date-time',
  })
  timestamp: string;
}

/** Standard error envelope produced by the global exception filter. */
export class ApiErrorResponseDto {
  @ApiProperty({
    description: 'Always `false` for error responses.',
    example: false,
  })
  success: boolean;

  @ApiProperty({
    description: 'HTTP status code echoed in the body.',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Human-readable summary of the failure.',
    example: 'Validation failed',
  })
  message: string;

  @ApiProperty({
    description:
      'Machine-readable validation details. Present for 400-level errors; omitted for generic failures.',
    example: ['email must be a valid email address'],
    type: [String],
    required: false,
  })
  errors?: string[];

  @ApiProperty({
    description: 'ISO 8601 UTC timestamp of when the error was produced.',
    example: '2026-10-02T16:10:00.000Z',
    format: 'date-time',
  })
  timestamp: string;
}
