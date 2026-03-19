"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("tenants", [
      {
        id: 1,
        name: "Main Tenant",
        slug: "main",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        id: 2,
        name: "Demo Tenant",
        slug: "demo",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("tenants", {
      id: [1, 2],
    });
  },
};
