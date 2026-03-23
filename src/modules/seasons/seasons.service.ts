import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { Season } from "@/modules/seasons/season.entity";
import { InjectModel } from "@nestjs/sequelize";
import { TournamentsService } from "@/modules/tournaments/tournaments.service";
import { CreateSeasonDto } from "@/modules/seasons/dto/create-season.dto";
import { UpdateSeasonDto } from "@/modules/seasons/dto/update-season.dto";
import { SportsService } from "@/modules/sports/sports.service";
import { normalizeSeasonRuleset } from "./season-ruleset.util";

@Injectable()
export class SeasonsService {
  constructor(
    @InjectModel(Season)
    private readonly seasonModel: typeof Season,
    private readonly tournamentsService: TournamentsService,
    private readonly sportsService: SportsService,
  ) {}

  async create(createSeasonDto: CreateSeasonDto): Promise<Season> {
    const tournament = await this.tournamentsService.findById(createSeasonDto.tournamentId);

    if (new Date(createSeasonDto.endDate) < new Date(createSeasonDto.startDate)) {
      throw new BadRequestException("endDate must be greater than startDate");
    }

    const existingSeason = await this.seasonModel.findOne({
      where: {
        tournamentId: createSeasonDto.tournamentId,
        name: createSeasonDto.name,
        year: createSeasonDto.year,
      },
    });

    if (existingSeason) {
      throw new ConflictException("Season with same name and year already exists");
    }

    const sportSlug = await this.resolveTournamentSportSlug(tournament.sportId);

    return this.seasonModel.create({
      ...createSeasonDto,
      ruleset: normalizeSeasonRuleset(createSeasonDto.ruleset, sportSlug),
    });
  }

  async findAll(): Promise<Season[]> {
    return this.seasonModel.findAll();
  }

  async findById(id: number): Promise<Season> {
    const season = await this.seasonModel.findByPk(id);

    if (!season) {
      throw new NotFoundException(`Season with ID ${id} not found`);
    }

    return season;
  }

  async update(id: number, dto: UpdateSeasonDto): Promise<Season> {
    const season = await this.findById(id);
    const nextStartDate = dto.startDate ?? season.startDate;
    const nextEndDate = dto.endDate ?? season.endDate;

    if (new Date(nextEndDate) < new Date(nextStartDate)) {
      throw new BadRequestException("endDate must be greater than startDate");
    }

    let ruleset = season.ruleset;

    if (dto.ruleset !== undefined) {
      const tournament = await this.tournamentsService.findById(season.tournamentId);
      const sportSlug = await this.resolveTournamentSportSlug(tournament.sportId);
      const currentSport = season.ruleset?.sport;
      ruleset = normalizeSeasonRuleset(dto.ruleset, currentSport ?? sportSlug);
    }

    await season.update({
      ...dto,
      ...(dto.ruleset !== undefined ? { ruleset } : {}),
    });

    return season;
  }

  async remove(id: number): Promise<void> {
    const season = await this.findById(id);

    await season.destroy();
  }

  private async resolveTournamentSportSlug(sportId?: number | null): Promise<string | undefined> {
    if (!sportId) {
      return undefined;
    }

    const sport = await this.sportsService.findById(sportId);
    return sport.slug;
  }
}
