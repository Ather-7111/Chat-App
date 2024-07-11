import { PrismaClient } from '@prisma/client';



export async function connect() {
 const prisma =  new PrismaClient();
 return prisma;

}
export default connect(); 

