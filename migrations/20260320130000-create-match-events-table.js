"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("match_events", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      match_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "matches", key: "id" },
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
        allowNull: true,
        defaultValue: null,
        references: { model: "players", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      related_player_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        references: { model: "players", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      tenant_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      type: {
        type: Sequelize.ENUM(
          "goal",
          "own_goal",
          "penalty_goal",
          "penalty_miss",
          "yellow_card",
          "red_card",
          "substitution",
          "injury",
          "timeout",
          "other",
        ),
        allowNull: false,
      },
      minute: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      extra_minute: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
      period: {
        type: Sequelize.ENUM(
          "first_half",
          "second_half",
          "extra_time_first_half",
          "extra_time_second_half",
          "penalties",
        ),
        allowNull: false,
      },
      description: { type: Sequelize.TEXT, allowNull: true, defaultValue: null },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      deleted_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
    });

    await queryInterface.addIndex("match_events", ["tenant_id"], {
      name: "match_events_tenant_id_idx",
    });
    await queryInterface.addIndex("match_events", ["match_id"], {
      name: "match_events_match_id_idx",
    });
    await queryInterface.addIndex("match_events", ["team_id"], {
      name: "match_events_team_id_idx",
    });
    await queryInterface.addIndex("match_events", ["player_id"], {
      name: "match_events_player_id_idx",
    });
    await queryInterface.addIndex("match_events", ["related_player_id"], {
      name: "match_events_related_player_id_idx",
    });
    await queryInterface.addIndex("match_events", ["type"], { name: "match_events_type_idx" });
    await queryInterface.addIndex("match_events", ["period"], { name: "match_events_period_idx" });
    await queryInterface.addIndex("match_events", ["minute"], { name: "match_events_minute_idx" });
    await queryInterface.addIndex("match_events", ["deleted_at"], {
      name: "match_events_deleted_at_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("match_events");
  },
};
