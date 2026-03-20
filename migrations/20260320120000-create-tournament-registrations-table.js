"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("tournament_registrations", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      player_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "players", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      tournament_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "tournaments", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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
        allowNull: true,
        defaultValue: null,
        references: { model: "teams", key: "id" },
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
      status: {
        type: Sequelize.ENUM("pending", "confirmed", "waitlist", "withdrawn", "rejected"),
        allowNull: false,
        defaultValue: "pending",
      },
      registered_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      jersey_number: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
      },
      position: {
        type: Sequelize.STRING(80),
        allowNull: true,
        defaultValue: null,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
    });

    await queryInterface.addIndex("tournament_registrations", ["tenant_id"], {
      name: "tournament_registrations_tenant_id_idx",
    });
    await queryInterface.addIndex("tournament_registrations", ["player_id"], {
      name: "tournament_registrations_player_id_idx",
    });
    await queryInterface.addIndex("tournament_registrations", ["tournament_id"], {
      name: "tournament_registrations_tournament_id_idx",
    });
    await queryInterface.addIndex("tournament_registrations", ["season_id"], {
      name: "tournament_registrations_season_id_idx",
    });
    await queryInterface.addIndex("tournament_registrations", ["team_id"], {
      name: "tournament_registrations_team_id_idx",
    });
    await queryInterface.addIndex("tournament_registrations", ["status"], {
      name: "tournament_registrations_status_idx",
    });
    await queryInterface.addIndex("tournament_registrations", ["deleted_at"], {
      name: "tournament_registrations_deleted_at_idx",
    });
    await queryInterface.addIndex("tournament_registrations", ["season_id", "player_id"], {
      unique: true,
      name: "tournament_registrations_season_player_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("tournament_registrations");
  },
};
