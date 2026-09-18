import { plainToInstance } from "class-transformer";
import { IsEnum, IsNumber, IsString, validateSync } from "class-validator";
import { Environment } from "../common/enums/environment.enum.js";

class EnvironmentVariables {
    @IsEnum(Environment)
    NODE_ENV: Environment;

    @IsString()
    DATABASE_HOST: string;

    @IsNumber()
    DATABASE_PORT: number;

    @IsString()
    DATABASE_USER: string;

    @IsString()
    DATABASE_PASSWORD: string;

    @IsString()
    DATABASE_NAME: string;  
}

export function validate(config: Record<string, any>) {
    const validatedConfig = plainToInstance(EnvironmentVariables, config, {
        enableImplicitConversion: true,
    });
    const errors = validateSync(validatedConfig, { skipMissingProperties: false });
    if (errors.length > 0) {
        throw new Error(errors.toString());
    }
    return validatedConfig;
}