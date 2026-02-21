import prisma from '@packages/libs/prisma';

const userRepository = {
  findByEmail: (email: string) => {
    return prisma.users.findUnique({
      where: { email },
    });
  },

  findById: (id:string) => {
    return prisma.users.findUnique({
      where: { id },
    });
  },

  create: (data: { name: string; email: string; password: string }) => {
    return prisma.users.create({
      data,
    });
  },

  update: (id: string, data: { password: string }) => {
    return prisma.users.update({
      where: { id },
      data,
    });
  },
};

export default userRepository;