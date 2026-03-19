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

@Injectable()
export class SeasonsService {
  constructor(
    @InjectModel(Season)
    private readonly seasonModel: typeof Season,
    private readonly tournamentsService: TournamentsService,
  ) {}

  async create(createSeasonDto: CreateSeasonDto): Promise<Season> {
    await this.tournamentsService.findById(createSeasonDto.tournamentId);

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

    return this.seasonModel.create(createSeasonDto);
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

    await season.update(dto);

    return season;
  }

  async remove(id: number): Promise<void> {
    const season = await this.findById(id);

    await season.destroy();
  }
}
