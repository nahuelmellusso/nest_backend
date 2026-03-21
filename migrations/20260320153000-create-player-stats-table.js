"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("player_stats", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      season_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "seasons", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      stage_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "stages", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      team_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "teams", key: "id" },
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
      matches_played: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      matches_started: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      minutes_played: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      goals: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      assists: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      yellow_cards: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      red_cards: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      own_goals: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      clean_sheets: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      deleted_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
    });

    await queryInterface.addIndex("player_stats", ["tenant_id"], {
      name: "player_stats_tenant_id_idx",
    });
    await queryInterface.addIndex("player_stats", ["season_id"], {
      name: "player_stats_season_id_idx",
    });
    await queryInterface.addIndex("player_stats", ["stage_id"], {
      name: "player_stats_stage_id_idx",
    });
    await queryInterface.addIndex("player_stats", ["team_id"], {
      name: "player_stats_team_id_idx",
    });
    await queryInterface.addIndex("player_stats", ["player_id"], {
      name: "player_stats_player_id_idx",
    });
    await queryInterface.addIndex("player_stats", ["goals"], { name: "player_stats_goals_idx" });
    await queryInterface.addIndex("player_stats", ["assists"], {
      name: "player_stats_assists_idx",
    });
    await queryInterface.addIndex("player_stats", ["deleted_at"], {
      name: "player_stats_deleted_at_idx",
    });
    await queryInterface.addConstraint("player_stats", {
      fields: ["stage_id", "team_id", "player_id"],
      type: "unique",
      name: "player_stats_stage_team_player_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("player_stats");
  },
};
