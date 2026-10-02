import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description:
      'Refresh JWT previously issued by signup/login/refresh. Must match the stored bcrypt hash; rotated on every use.',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNDdhYzEwYi01OGNjLTQzNzItYTU2Ny0wZTAyYjJjM2Q0NzkiLCJlbWFpbCI6ImF2YS5wYXRlbEBleGFtcGxlLmNvbSIsInR5cGUiOiJyZWZyZXNoIiwiandsaSI6ImFiYzEyMzQ1LTY3ODktYWJjZC1lZmdoLWlqa2xtbm9wcXJzIiwiaWF0IjoxNzU5NDYzMDAwLCJleHAiOjE3NjAwNjc4MDB9.8K7mNpX2vR4sT9uVw0xYzAbCdEfGhIjKlMnOpQrStU',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
