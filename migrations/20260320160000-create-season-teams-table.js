"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("season_teams", {
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
      status: {
        type: Sequelize.ENUM("pending", "confirmed", "withdrawn", "eliminated"),
        allowNull: false,
        defaultValue: "confirmed",
      },
      registered_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      seed: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
      group_name: { type: Sequelize.STRING(80), allowNull: true, defaultValue: null },
      notes: { type: Sequelize.STRING(255), allowNull: true, defaultValue: null },
      metadata: { type: Sequelize.JSON, allowNull: true, defaultValue: null },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      deleted_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
    });

    await queryInterface.addIndex("season_teams", ["tenant_id"], {
      name: "season_teams_tenant_id_idx",
    });
    await queryInterface.addIndex("season_teams", ["season_id"], {
      name: "season_teams_season_id_idx",
    });
    await queryInterface.addIndex("season_teams", ["team_id"], {
      name: "season_teams_team_id_idx",
    });
    await queryInterface.addIndex("season_teams", ["status"], { name: "season_teams_status_idx" });
    await queryInterface.addIndex("season_teams", ["seed"], { name: "season_teams_seed_idx" });
    await queryInterface.addIndex("season_teams", ["deleted_at"], {
      name: "season_teams_deleted_at_idx",
    });
    await queryInterface.addConstraint("season_teams", {
      fields: ["season_id", "team_id"],
      type: "unique",
      name: "season_teams_season_team_unique",
    });
    await queryInterface.addConstraint("season_teams", {
      fields: ["season_id", "seed"],
      type: "unique",
      name: "season_teams_season_seed_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("season_teams");
  },
};
