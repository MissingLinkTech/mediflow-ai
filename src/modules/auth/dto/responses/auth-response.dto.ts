import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '@/modules/users/dto/responses/user-response.dto.js';

const ACCESS_TOKEN_EXAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNDdhYzEwYi01OGNjLTQzNzItYTU2Ny0wZTAyYjJjM2Q0NzkiLCJlbWFpbCI6ImF2YS5wYXRlbEBleGFtcGxlLmNvbSIsInR5cGUiOiJhY2Nlc3MiLCJqdGkiOiIxMmFiMzRkNS02NjdjLTQ4YTktOWYxMi0zNDU2Nzg5MGFiY2QiLCJpYXQiOjE3NTk0NjMwMDAsImV4cCI6MTc1OTQ2MzkwMH0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const REFRESH_TOKEN_EXAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNDdhYzEwYi01OGNjLTQzNzItYTU2Ny0wZTAyYjJjM2Q0NzkiLCJlbWFpbCI6ImF2YS5wYXRlbEBleGFtcGxlLmNvbSIsInR5cGUiOiJyZWZyZXNoIiwiandsaSI6ImFiYzEyMzQ1LTY3ODktYWJjZC1lZmdoLWlqa2xtbm9wcXJzIiwiaWF0IjoxNzU5NDYzMDAwLCJleHAiOjE3NjAwNjc4MDB9.8K7mNpX2vR4sT9uVw0xYzAbCdEfGhIjKlMnOpQrStU';

/**
 * JWT pair issued on login / signup / refresh.
 */
export class TokenPairResponseDto {
  @ApiProperty({
    description:
      'Short-lived access JWT. Send as `Authorization: Bearer <token>` on protected routes.',
    example: ACCESS_TOKEN_EXAMPLE,
  })
  accessToken: string;

  @ApiProperty({
    description:
      'Long-lived refresh JWT. Send it in the `refreshToken` body field to `POST /auth/refresh_token`. Rotated on every use.',
    example: REFRESH_TOKEN_EXAMPLE,
  })
  refreshToken: string;
}

/**
 * Payload returned by signup and login, wrapped in the success envelope.
 */
export class AuthResponseDto extends TokenPairResponseDto {
  @ApiProperty({
    description: 'Newly created or authenticated user (secrets excluded).',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}
