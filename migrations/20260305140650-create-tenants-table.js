"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("tenants", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },

      slug: {
        type: Sequelize.STRING(180),
        allowNull: false,
        unique: true,
      },

      status: {
        type: Sequelize.ENUM("active", "inactive", "suspended"),
        allowNull: false,
        defaultValue: "active",
      },

      settings: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
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

    await queryInterface.addIndex("tenants", ["slug"], {
      unique: true,
      name: "tenants_slug_unique",
    });

    await queryInterface.addIndex("tenants", ["status"], {
      name: "tenants_status_idx",
    });

    await queryInterface.addIndex("tenants", ["deleted_at"], {
      name: "tenants_deleted_at_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("tenants");
  },
};
