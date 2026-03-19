"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("stages", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      season_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "seasons",
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
      type: {
        type: Sequelize.ENUM(
          "regular_season",
          "group_stage",
          "playoff",
          "knockout",
          "final",
          "friendly",
          "other",
        ),
        allowNull: false,
      },
      order_index: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
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

    await queryInterface.addIndex("stages", ["tenant_id"], {
      name: "stages_tenant_id_idx",
    });

    await queryInterface.addIndex("stages", ["season_id"], {
      name: "stages_season_id_idx",
    });

    await queryInterface.addIndex("stages", ["type"], {
      name: "stages_type_idx",
    });

    await queryInterface.addIndex("stages", ["is_active"], {
      name: "stages_is_active_idx",
    });

    await queryInterface.addIndex("stages", ["deleted_at"], {
      name: "stages_deleted_at_idx",
    });

    await queryInterface.addIndex("stages", ["season_id", "order_index"], {
      unique: true,
      name: "stages_season_order_index_unique",
    });

    await queryInterface.addIndex("stages", ["season_id", "name"], {
      unique: true,
      name: "stages_season_name_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("stages");
  },
};
