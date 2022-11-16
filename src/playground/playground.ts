// @ts-ignore
import express from "express";
// @ts-ignore
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
    const { type, date, age } = req.query;

    const result = (
      await connection.query(
        "SELECT cost FROM `base_price` " + "WHERE `type` = ? ",
        [type]
      )
    )[0][0];

    let cost;
    if (age < 6) {
      cost = 0;
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
          cost = Math.ceil(result.cost * 0.7);
        } else {
          if (age === undefined) {
            cost = Math.ceil(result.cost * (1 - reduction / 100));
          } else {
            if (age > 64) {
              cost = Math.ceil(result.cost * 0.75 * (1 - reduction / 100));
            } else {
              cost = Math.ceil(result.cost * (1 - reduction / 100));
            }
          }
        }
      } else {
        if (age >= 6) {
          if (age > 64) {
            cost = Math.ceil(result.cost * 0.4);
          } else {
            cost = result.cost;
          }
        } else {
          cost = 0;
        }
      }
    }

    res.json({ cost });
  });

  return { app, connection };
}

export { createApp };
