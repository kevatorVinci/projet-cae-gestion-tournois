/**
 * Interface representing the data needed to create a new tournament.
 * This defines the shape of the "package" we send to the backend.
 */
export interface NewTournamentPayload {
  nom: string; // The unique name of the tournament
  description: string; // A short description
  dateDebut: string; // The start date (format YYYY-MM-DD)
  dateFin: string; // The end date (format YYYY-MM-DD)
  dateLimiteInscription: string; // The deadline for registrations
  nombresParticipantsMax: number; // The maximum number of teams allowed
}

/**
 * Function to send the new tournament data to the backend API.
 *
 * @param {NewTournamentPayload} payload - the data of the new tournament typed by the admin
 * @param {string} token - the security badge (JWT token) of the logged-in admin
 * @return {Promise<any>} the created tournament data from the server
 */
export const createTournament = async (
  payload: NewTournamentPayload,
  token: string,
) => {
  // 1. We prepare the settings for the request (POST method, JSON data, and security token)
  const requestOptions = {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      Authorization: token, // We prove we are an admin
    },
  };

  // 2. We send the request to the backend URL "/api/tournois/"
  // (Note: adjust the URL if your proxy is different, e.g., simply "/tournois/")
  const response = await fetch('/api/tournois/', requestOptions);

  // 3. We check if the server refused the request (e.g., if the name already exists)
  if (!response.ok) {
    throw new Error(
      'Failed to create tournament. Maybe the name is already taken.',
    );
  }

  // 4. We read the successful response from the server and return it
  const data = await response.json();
  return data;
};

/**
 * Function to fetch all tournaments from the backend, including the secret drafts.
 * This is strictly reserved for administrators.
 *
 * @param {string} token - the security badge (JWT token) of the logged-in admin to prove their identity
 * @return {Promise<any>} a list containing every tournament from the database
 */
export const fetchAllTournaments = async (token: string) => {
  // 1. We prepare the request settings with the security badge
  const requestOptions = {
    method: 'GET',
    headers: {
      Authorization: token, // We prove we are an admin
    },
  };

  // 2. We send the request to the specific admin URL "/api/tournois/all"
  const response = await fetch('/api/tournois/all', requestOptions);

  // 3. We check if the server refused (e.g., if the user is not a real admin)
  if (!response.ok) {
    throw new Error(
      'Failed to fetch all tournaments. You might not have admin rights.',
    );
  }

  // 4. We read the data (the list of tournaments) and return it
  const data = await response.json();
  return data;
};
