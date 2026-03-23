"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("season_team_players", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      season_team_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "season_teams", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      player_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "players", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      tenant_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      jersey_number: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
      position: { type: Sequelize.STRING(80), allowNull: true, defaultValue: null },
      status: {
        type: Sequelize.ENUM("active", "inactive", "transferred", "released"),
        allowNull: false,
        defaultValue: "active",
      },
      joined_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      left_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      is_captain: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      metadata: { type: Sequelize.JSON, allowNull: true, defaultValue: null },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      deleted_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
    });

    await queryInterface.addIndex("season_team_players", ["tenant_id"], {
      name: "season_team_players_tenant_id_idx",
    });
    await queryInterface.addIndex("season_team_players", ["season_team_id"], {
      name: "season_team_players_season_team_id_idx",
    });
    await queryInterface.addIndex("season_team_players", ["player_id"], {
      name: "season_team_players_player_id_idx",
    });
    await queryInterface.addIndex("season_team_players", ["status"], {
      name: "season_team_players_status_idx",
    });
    await queryInterface.addIndex("season_team_players", ["jersey_number"], {
      name: "season_team_players_jersey_number_idx",
    });
    await queryInterface.addIndex("season_team_players", ["deleted_at"], {
      name: "season_team_players_deleted_at_idx",
    });
    await queryInterface.addConstraint("season_team_players", {
      fields: ["season_team_id", "player_id"],
      type: "unique",
      name: "season_team_players_season_team_player_unique",
    });
    await queryInterface.addConstraint("season_team_players", {
      fields: ["season_team_id", "jersey_number"],
      type: "unique",
      name: "season_team_players_season_team_jersey_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("season_team_players");
  },
};
