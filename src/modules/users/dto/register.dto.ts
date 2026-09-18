import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
    @IsNotEmpty()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    @MaxLength(128)
    password: string;
}