"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("tournaments", "sport_id", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      references: {
        model: "sports",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addIndex("tournaments", ["sport_id"], {
      name: "tournaments_sport_id_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("tournaments", "tournaments_sport_id_idx");
    await queryInterface.removeColumn("tournaments", "sport_id");
  },
};
