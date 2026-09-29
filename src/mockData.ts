import type { Team } from './types';

const names = [
  ['Las Reinas', 'Ana Torres', 'Lucía Méndez'], ['Doble Juego', 'Carla Ruiz', 'Marina López'],
  ['Las Comodines', 'Sofía Vega', 'Paula Díaz'], ['Escala Real', 'Marta Silva', 'Elena Castro'],
  ['Las Estrategas', 'Laura Paz', 'Inés Rojas'], ['Mesa Maestra', 'Julia León', 'Rocío Luna'],
  ['Canasta Dorada', 'Cecilia Gil', 'Noelia Sáez'], ['Las Invencibles', 'Clara Rey', 'Irene Vidal'],
  ['Doble Corona', 'Camila Soto', 'Pilar Costa'], ['Las Audaces', 'Natalia Mora', 'Alicia Núñez'],
  ['Juego Limpio', 'Belén Vera', 'Eva Ramos'], ['Las Brillantes', 'Diana Sol', 'Mónica Ferrer'],
  ['Reinas del Paño', 'Silvia Arias', 'Andrea Blanco'], ['Punto Burako', 'Gabriela Cano', 'Patricia Mena'],
  ['Las Imparables', 'Daniela Lara', 'Victoria Peña'], ['Última Mano', 'Florencia Ortiz', 'Valeria Campos'],
];

export const mockTeams: Team[] = names.map(([name, a, b], index) => ({ id: `team-${index + 1}`, name, players: [a, b], seed: index + 1 }));
