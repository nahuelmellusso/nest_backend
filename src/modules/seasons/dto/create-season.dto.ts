import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsString, MaxLength, Min } from "class-validator";
import { Type } from "class-transformer";
import { SeasonStatus } from "@/enums/season-status.enum";
import { IsDateRangeValid } from "@/validators/is-date-range-valid.validator";

export class CreateSeasonDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tournamentId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @Type(() => Number)
  @IsInt()
  @Min(1900)
  year: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsEnum(SeasonStatus)
  status: SeasonStatus;

  @IsDateRangeValid("startDate", "endDate", {
    message: "endDate must be greater than or equal to startDate",
  })
  dateRangeValidation: boolean;
}
