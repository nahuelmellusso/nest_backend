import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import { RoundStatus } from "@/enums/round-status.enum";
import { IsDateRangeValid } from "@/validators/is-date-range-valid.validator";

export class CreateRoundDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  stageId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Transform(({ value }) => value?.trim())
  name: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  roundNumber: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsEnum(RoundStatus)
  status?: RoundStatus;

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsDateRangeValid("startDate", "endDate", {
    message: "endDate must be greater than or equal to startDate",
  })
  dateRangeValidation?: boolean;
}
