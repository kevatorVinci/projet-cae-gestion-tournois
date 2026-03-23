import { useState, FormEvent } from 'react';
import {
  createTournament,
  NewTournamentPayload,
} from '../../services/tournois';

/**
 * Component to display and handle the form for creating a new tournament.
 *
 * @return {JSX.Element} the form component
 */
const CreateTournament = () => {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [dateLimiteInscription, setDateLimiteInscription] = useState('');
  const [nombresParticipantsMax, setNombresParticipantsMax] = useState(0);

  // Memory variables to display success or error messages to the user
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  /**
   * Function called when the admin clicks the submit button.
   *
   * @param {FormEvent} e - the form submission event
   */
  const handleSubmit = async (e: FormEvent) => {
    // Prevents the web page from reloading when we click the button
    e.preventDefault();

    // We reset the messages before trying to send
    setMessage('');
    setError('');

    // We get the security badge from the browser's storage
    // Note: Adapt "token" if your app uses a different key name for the JWT
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in as an admin to do this.');
      return;
    }

    // We prepare the package exactly as our service expects it
    const payload: NewTournamentPayload = {
      nom: nom,
      description: description,
      dateDebut: dateDebut,
      dateFin: dateFin,
      dateLimiteInscription: dateLimiteInscription,
      nombresParticipantsMax: nombresParticipantsMax,
    };

    try {
      // We use our "postman" function from tournois.ts to send the package
      await createTournament(payload, token);

      // If it works, we show a green success message
      setMessage('Tournament successfully created!');

      // We empty all the text boxes to be ready for another creation
      setNom('');
      setDescription('');
      setDateDebut('');
      setDateFin('');
      setDateLimiteInscription('');
      setNombresParticipantsMax(0);
    } catch (err) {
      // If the server says no, we show a red error message
      setError(
        'Failed to create the tournament. The name might already be used.',
      );
    }
  };

  // The visual part: what we actually see on the screen (HTML)
  return (
    <div className="create-tournament-container">
      <h2>Create a New Tournament</h2>

      {/* We show the messages only if they are not empty */}
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Name: </label>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Description: </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label>Start Date: </label>
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            required
          />
        </div>

        <div>
          <label>End Date: </label>
          <input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Registration Deadline: </label>
          <input
            type="date"
            value={dateLimiteInscription}
            onChange={(e) => setDateLimiteInscription(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Max Participants: </label>
          <input
            type="number"
            value={nombresParticipantsMax}
            onChange={(e) => setNombresParticipantsMax(Number(e.target.value))}
            required
            min="2"
          />
        </div>

        <button type="submit">Create Tournament</button>
      </form>
    </div>
  );
};

export default CreateTournament;
