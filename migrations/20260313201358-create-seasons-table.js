"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("seasons", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      tournament_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "tournaments",
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
      year: {
        type: Sequelize.INTEGER,
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
        type: Sequelize.ENUM("draft", "upcoming", "active", "finished", "cancelled"),
        allowNull: false,
        defaultValue: "draft",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex("seasons", ["tournament_id"]);
    await queryInterface.addIndex("seasons", ["year"]);
    await queryInterface.addIndex("seasons", ["status"]);

    await queryInterface.addIndex("seasons", ["tournament_id", "name", "year"], {
      unique: true,
      name: "seasons_tournament_name_year_unique",
    });

    await queryInterface.addIndex("seasons", ["tenant_id"], {
      name: "seasons_tenant_id_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("seasons", "seasons_tournament_name_year_unique");
    await queryInterface.dropTable("seasons");
  },
};
