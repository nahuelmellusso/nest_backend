"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("tournaments", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },

      slug: {
        type: Sequelize.STRING(140),
        allowNull: false,
        unique: true,
      },

      type: {
        type: Sequelize.ENUM("league", "cup", "group_stage", "playoff", "friendly"),
        allowNull: false,
      },

      country: {
        type: Sequelize.STRING(2),
        allowNull: false,
      },

      image: {
        type: Sequelize.STRING(255),
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
      },
    });

    await queryInterface.addIndex("tournaments", ["name"]);
    await queryInterface.addIndex("tournaments", ["country"]);
    await queryInterface.addIndex("tournaments", ["type"]);
    await queryInterface.addIndex("tournaments", ["is_active"]);
    await queryInterface.addIndex("tournaments", ["deleted_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("tournaments");
  },
};
