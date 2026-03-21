"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("match_lineups", {
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
      role: {
        type: Sequelize.ENUM("starter", "substitute", "reserve"),
        allowNull: false,
      },
      position: {
        type: Sequelize.STRING(80),
        allowNull: true,
        defaultValue: null,
      },
      shirt_number: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
      },
      is_captain: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      minute_in: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
      },
      minute_out: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      deleted_at: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
    });

    await queryInterface.addIndex("match_lineups", ["tenant_id"], {
      name: "match_lineups_tenant_id_idx",
    });
    await queryInterface.addIndex("match_lineups", ["match_id"], {
      name: "match_lineups_match_id_idx",
    });
    await queryInterface.addIndex("match_lineups", ["team_id"], {
      name: "match_lineups_team_id_idx",
    });
    await queryInterface.addIndex("match_lineups", ["player_id"], {
      name: "match_lineups_player_id_idx",
    });
    await queryInterface.addIndex("match_lineups", ["role"], {
      name: "match_lineups_role_idx",
    });
    await queryInterface.addIndex("match_lineups", ["deleted_at"], {
      name: "match_lineups_deleted_at_idx",
    });
    await queryInterface.addConstraint("match_lineups", {
      fields: ["match_id", "team_id", "player_id"],
      type: "unique",
      name: "match_lineups_match_team_player_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("match_lineups");
  },
};
