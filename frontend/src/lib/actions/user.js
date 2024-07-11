"use server";
import { connect } from "../db";

export async function getAllUsers() {
  try {
    let prisma = await connect();
    // console.log("hijra", prisma);
    // console.log("p",p)
    const users = await prisma.user.findMany({
      //   where: {
      //     name: {
      //       contains: query,
      //     },
      //   },
    });
    // console.log("hijra", users);
    return users;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
