"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("sports", [
      {
        id: 1,
        name: "Football",
        slug: "football",
        type: "team",
        status: "active",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        name: "Basketball",
        slug: "basketball",
        type: "team",
        status: "active",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 3,
        name: "Tennis",
        slug: "tennis",
        type: "individual",
        status: "active",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("sports", {
      id: [1, 2, 3],
    });
  },
};
