import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import { StageType } from "@/enums/stage-type.enum";

export class CreateStageDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  seasonId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsEnum(StageType)
  type: StageType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  orderIndex: number;

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
