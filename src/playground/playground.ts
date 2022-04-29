// @ts-expect-error
import express from "express";
// @ts-expect-error
import mysql from "mysql2/promise";

async function createApp({ port }: { port: number } = { port: 3306 }) {
  const app = express();

  let connectionOptions = {
    host: "localhost",
    user: "root",
    database: "lift_pass",
    password: "mysql",
    port
  };
  const connection = await mysql.createConnection(connectionOptions);

  app.put("/prices", async (req, res) => {
    const liftPassCost = req.query.cost;
    const liftPassType = req.query.type;
    const [rows, fields] = await connection.query(
      "INSERT INTO `base_price` (type, cost) VALUES (?, ?) " +
        "ON DUPLICATE KEY UPDATE cost = ?",
      [liftPassType, liftPassCost, liftPassCost]
    );

    res.json();
  });
  app.get("/prices", async (req, res) => {
    const { type } = req.query;
    const { age } = req.query;
    const { date } = req.query;

    const result = (
      await connection.query(
        "SELECT cost FROM `base_price` " + "WHERE `type` = ? ",
        [type]
      )
    )[0][0];
    if (age < 6) {
      res.json({ cost: 0 });
    } else {
      if (type !== "night") {
        const holidays = (
          await connection.query("SELECT * FROM `holidays`")
        )[0];

        let isHoliday;
        let reduction = 0;
        for (let row of holidays) {
          let holiday = row.holiday;
          if (date) {
            let d = new Date(date);
            if (
              d.getFullYear() === holiday.getFullYear() &&
              d.getMonth() === holiday.getMonth() &&
              d.getDate() === holiday.getDate()
            ) {
              isHoliday = true;
            }
          }
        }

        if (!isHoliday && new Date(date).getDay() === 1) {
          reduction = 35;
        }

        // TODO apply reduction for others
        if (age < 15) {
          res.json({ cost: Math.ceil(result.cost * 0.7) });
        } else {
          if (age === undefined) {
            let cost = result.cost * (1 - reduction / 100);
            res.json({ cost: Math.ceil(cost) });
          } else {
            if (age > 64) {
              let cost = result.cost * 0.75 * (1 - reduction / 100);
              res.json({ cost: Math.ceil(cost) });
            } else {
              let cost = result.cost * (1 - reduction / 100);
              res.json({ cost: Math.ceil(cost) });
            }
          }
        }
      } else {
        if (age >= 6) {
          if (age > 64) {
            res.json({ cost: Math.ceil(result.cost * 0.4) });
          } else {
            res.json(result);
          }
        } else {
          res.json({ cost: 0 });
        }
      }
    }
  });
  return { app, connection };
}

export { createApp };
