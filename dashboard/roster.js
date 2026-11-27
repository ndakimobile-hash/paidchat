// Fictional demo identities. Portraits are representative illustrations of the profiles.
const rosterGroups = [
  ['GB', 'Charlotte Amelia Isla Poppy Florence Imogen Harriet Beatrice Matilda Phoebe Alice Eleanor Rose Felicity Georgina Eliza Violet Mabel Edith Freya', 'Bennett Clarke Fletcher Graham'],
  ['US', 'Mason Ethan Logan Cameron Hudson Wyatt Carter Nolan Miles Owen Blake Caleb Austin Chase Wesley Grant Everett Asher Cole Dylan', 'Parker Brooks Hayes Reed'],
  ['FR', 'Camille Juliette Manon Chloé Lucie Margaux Amélie Anaïs Clémence Élodie Inès Maëlle Léonie Céline Solène Agathe Noémie Océane Amandine Capucine', 'Laurent Dubois Moreau Mercier'],
  ['DE', 'Felix Jonas Lukas Moritz Florian Tobias Maximilian Sebastian Julian Anton Emil Finn Benedikt Hannes Matthias Fabian Simon Oskar Elias Niklas', 'Weber Fischer Wagner Klein'],
  ['IT', 'Giulia Serena Lucia Bianca Chiara Francesca Alessia Valentina Federica Aurora Viola Ginevra Beata Martina Giorgia Letizia Arianna Camilla Vittoria Elena', 'Rossi Conti Ferraro Lombardi'],
  ['ES', 'Alejandro Álvaro Diego Hugo Mateo Pablo Sergio Adrián Bruno Javier Marcos Raúl Rubén Darío Mario Jorge Héctor Iván Iker Nicolás', 'García Romero Navarro Molina'],
  ['CA', 'Claire Audrey Quinn Harper Abigail Brooklyn Eden Sienna Paige Lauren Brooke Avery Hazel Zoey Summer Morgan Piper Delaney Reese Cassidy', 'Martin Cooper Fraser Campbell'],
  ['AU', 'Lachlan Angus Archie Hamish Harrison Henry Darcy Lachie Callum Rhys Kieran Nathan Hamdan Declan Flynn Riley Toby Max Spencer Fletcher', 'Turner Scott Ellis Walsh'],
  ['PT', 'Beatriz Leonor Mariana Joana Madalena Mafalda Rita Carolina Vitória Catarina Matilde Constança Teresa Filipa Francisca Benedita Isabel Dulce Eduarda Ema', 'Silva Costa Pereira Almeida'],
  ['SE', 'Albin Axel August Antonin Benjamin Edvin Erik Gustav Hjalmar Jakob Karl Linus Ludvig Malte Melvin Nils Olle Sixten Theo Vilgot', 'Andersson Lindberg Nyström Berglund']
];
const demoRoster = rosterGroups.flatMap(([country, first, surnames]) => {
  const familyNames = surnames.split(' ');
  return first.split(' ').map((name, index) => ({
    firstName: name,
    lastName: familyNames[index % familyNames.length],
    country
  }));
});
