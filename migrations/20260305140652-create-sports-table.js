"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sports", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      slug: {
        type: Sequelize.STRING(120),
        allowNull: false,
        unique: true,
      },

      type: {
        type: Sequelize.ENUM("team", "individual", "doubles", "mixed"),
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM("active", "inactive"),
        allowNull: false,
        defaultValue: "active",
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
    });

    // @todo check this
    /*await queryInterface.addIndex("tournaments", ["tenant_id"], {
      name: "tournaments_tenant_id_idx",
    });*/

    await queryInterface.addIndex("sports", ["slug"], {
      unique: true,
      name: "sports_slug_unique",
    });

    await queryInterface.addIndex("sports", ["status"], {
      name: "sports_status_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("sports");
  },
};
