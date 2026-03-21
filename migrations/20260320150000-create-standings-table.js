"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("standings", {
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
      tenant_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      played: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      wins: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      draws: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      losses: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      goals_for: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      goals_against: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      goal_difference: { type: Sequelize.INTEGER, allowNull: false },
      points: { type: Sequelize.INTEGER, allowNull: false },
      position: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      last_five_form: { type: Sequelize.STRING(5), allowNull: true, defaultValue: null },
      notes: { type: Sequelize.STRING(255), allowNull: true, defaultValue: null },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      deleted_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
    });

    await queryInterface.addIndex("standings", ["tenant_id"], { name: "standings_tenant_id_idx" });
    await queryInterface.addIndex("standings", ["season_id"], { name: "standings_season_id_idx" });
    await queryInterface.addIndex("standings", ["stage_id"], { name: "standings_stage_id_idx" });
    await queryInterface.addIndex("standings", ["team_id"], { name: "standings_team_id_idx" });
    await queryInterface.addIndex("standings", ["position"], { name: "standings_position_idx" });
    await queryInterface.addIndex("standings", ["points"], { name: "standings_points_idx" });
    await queryInterface.addIndex("standings", ["deleted_at"], {
      name: "standings_deleted_at_idx",
    });
    await queryInterface.addConstraint("standings", {
      fields: ["stage_id", "team_id"],
      type: "unique",
      name: "standings_stage_team_unique",
    });
    await queryInterface.addConstraint("standings", {
      fields: ["stage_id", "position"],
      type: "unique",
      name: "standings_stage_position_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("standings");
  },
};
