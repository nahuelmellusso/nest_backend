"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("rounds", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      stage_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "stages",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      tenant_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "tenants",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      round_number: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("scheduled", "in_progress", "closed", "cancelled"),
        allowNull: false,
        defaultValue: "scheduled",
      },
      settings: {
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
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      deleted_at: {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: null,
      },
    });

    await queryInterface.addIndex("rounds", ["tenant_id"], {
      name: "rounds_tenant_id_idx",
    });

    await queryInterface.addIndex("rounds", ["stage_id"], {
      name: "rounds_stage_id_idx",
    });

    await queryInterface.addIndex("rounds", ["status"], {
      name: "rounds_status_idx",
    });

    await queryInterface.addIndex("rounds", ["is_active"], {
      name: "rounds_is_active_idx",
    });

    await queryInterface.addIndex("rounds", ["deleted_at"], {
      name: "rounds_deleted_at_idx",
    });

    await queryInterface.addIndex("rounds", ["stage_id", "round_number"], {
      unique: true,
      name: "rounds_stage_round_number_unique",
    });

    await queryInterface.addIndex("rounds", ["stage_id", "name"], {
      unique: true,
      name: "rounds_stage_name_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("rounds");
  },
};
