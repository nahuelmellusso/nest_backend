"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("matches", {
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
      round_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "rounds", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      home_team_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "teams", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      away_team_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "teams", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      tenant_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      stadium: { type: Sequelize.STRING(180), allowNull: true, defaultValue: null },
      match_date: { type: Sequelize.DATE, allowNull: false },
      status: {
        type: Sequelize.ENUM(
          "scheduled",
          "in_progress",
          "completed",
          "postponed",
          "cancelled",
          "awarded",
        ),
        allowNull: false,
        defaultValue: "scheduled",
      },
      home_score: { type: Sequelize.INTEGER, allowNull: true, defaultValue: null },
      away_score: { type: Sequelize.INTEGER, allowNull: true, defaultValue: null },
      home_penalty_score: { type: Sequelize.INTEGER, allowNull: true, defaultValue: null },
      away_penalty_score: { type: Sequelize.INTEGER, allowNull: true, defaultValue: null },
      extra_time_played: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      notes: { type: Sequelize.TEXT, allowNull: true, defaultValue: null },
      settings: { type: Sequelize.JSON, allowNull: true, defaultValue: null },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      deleted_at: { allowNull: true, type: Sequelize.DATE, defaultValue: null },
    });

    await queryInterface.addIndex("matches", ["tenant_id"], { name: "matches_tenant_id_idx" });
    await queryInterface.addIndex("matches", ["season_id"], { name: "matches_season_id_idx" });
    await queryInterface.addIndex("matches", ["stage_id"], { name: "matches_stage_id_idx" });
    await queryInterface.addIndex("matches", ["round_id"], { name: "matches_round_id_idx" });
    await queryInterface.addIndex("matches", ["home_team_id"], {
      name: "matches_home_team_id_idx",
    });
    await queryInterface.addIndex("matches", ["away_team_id"], {
      name: "matches_away_team_id_idx",
    });
    await queryInterface.addIndex("matches", ["match_date"], { name: "matches_match_date_idx" });
    await queryInterface.addIndex("matches", ["status"], { name: "matches_status_idx" });
    await queryInterface.addIndex("matches", ["deleted_at"], { name: "matches_deleted_at_idx" });
    await queryInterface.addIndex("matches", ["round_id", "home_team_id", "away_team_id"], {
      unique: true,
      name: "matches_round_fixture_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("matches");
  },
};
