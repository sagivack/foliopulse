import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 12 questions du questionnaire d'onboarding (cahier des charges 3.1).
 * Échelle de réponse : 1 (très prudent) à 5 (très agressif).
 * weight ajustable pour donner plus de poids à certaines questions
 * (ex: horizon de placement pèse plus que les préférences esthétiques).
 */
const questions = [
  { order: 1, weight: 1.5, text: "Quel est votre horizon d'investissement ?" },
  { order: 2, weight: 1.2, text: 'Quelle part de vos économies êtes-vous prêt à investir ?' },
  { order: 3, weight: 1.5, text: 'Comment réagiriez-vous à une baisse de 20% de votre portefeuille ?' },
  { order: 4, weight: 1.0, text: 'Avez-vous déjà investi en bourse auparavant ?' },
  { order: 5, weight: 1.3, text: 'Quel est votre objectif principal ?' },
  { order: 6, weight: 1.0, text: 'À quelle fréquence souhaitez-vous suivre vos investissements ?' },
  { order: 7, weight: 1.2, text: 'Quelle importance accordez-vous à la stabilité de vos revenus ?' },
  { order: 8, weight: 1.1, text: "Quel pourcentage de perte maximale accepteriez-vous sur une année ?" },
  { order: 9, weight: 1.0, text: 'Investiriez-vous dans des actifs volatils comme les cryptomonnaies ?' },
  { order: 10, weight: 1.4, text: 'Votre situation financière actuelle vous permet-elle de prendre des risques ?' },
  { order: 11, weight: 1.0, text: 'Préférez-vous des gains modestes mais réguliers, ou des gains potentiellement élevés mais incertains ?' },
  { order: 12, weight: 1.3, text: "Quel est votre niveau de connaissance des marchés financiers ?" },
];

async function main() {
  for (const q of questions) {
    await prisma.question.upsert({
      where: { order: q.order },
      update: { text: q.text, weight: q.weight },
      create: q,
    });
  }
  // eslint-disable-next-line no-console
  console.log(`✅ ${questions.length} questions insérées/mises à jour`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
