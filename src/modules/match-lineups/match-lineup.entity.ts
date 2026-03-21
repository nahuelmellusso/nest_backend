import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { MatchLineupRole } from "@/enums/match-lineup-role.enum";
import { Match } from "@/modules/matches/match.entity";
import { Player } from "@/modules/players/player.entity";
import { Team } from "@/modules/teams/team.entity";

@Table({
  tableName: "match_lineups",
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class MatchLineup extends Model<MatchLineup> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true })
  declare id: number;

  @ForeignKey(() => Match)
  @Column({ field: "match_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare matchId: number;

  @ForeignKey(() => Team)
  @Column({ field: "team_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare teamId: number;

  @ForeignKey(() => Player)
  @Column({ field: "player_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare playerId: number;

  @Column({ field: "tenant_id", type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare tenantId: number;

  @Column({ type: DataType.ENUM(...Object.values(MatchLineupRole)), allowNull: false })
  declare role: MatchLineupRole;

  @Column({ type: DataType.STRING(80), allowNull: true, defaultValue: null })
  declare position: string | null;

  @Column({
    field: "shirt_number",
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: null,
  })
  declare shirtNumber: number | null;

  @Default(false)
  @Column({ field: "is_captain", type: DataType.BOOLEAN, allowNull: false })
  declare isCaptain: boolean;

  @Column({
    field: "minute_in",
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: null,
  })
  declare minuteIn: number | null;

  @Column({
    field: "minute_out",
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: null,
  })
  declare minuteOut: number | null;

  @BelongsTo(() => Match)
  declare match: Match;

  @BelongsTo(() => Team)
  declare team: Team;

  @BelongsTo(() => Player)
  declare player: Player;
}
