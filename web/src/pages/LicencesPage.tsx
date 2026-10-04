import { SOUNDS } from '../catalogue'

export function LicencesPage() {
  return (
    <main className="page">
      <h1>Licences</h1>
      <p className="lead">
        Every sound and picture in Ambiancy is listed here with where it came from and the licence it is used under.
      </p>

      <h2 id="licences-sounds">Sounds</h2>
      <table aria-labelledby="licences-sounds">
        <thead>
          <tr>
            <th scope="col">Sound</th>
            <th scope="col">Author</th>
            <th scope="col">Licence</th>
            <th scope="col">Source</th>
          </tr>
        </thead>
        <tbody>
          {SOUNDS.map((sound) => (
            <tr key={sound.id}>
              <th scope="row">{sound.name}</th>
              <td>{sound.author}</td>
              <td>{sound.licence}</td>
              <td>{sound.source}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 id="licences-pictures">Pictures</h2>
      <p>Pictures are from Wikimedia Commons, resized and cropped to fit.</p>
      <table aria-labelledby="licences-pictures">
        <thead>
          <tr>
            <th scope="col">Picture for</th>
            <th scope="col">Author</th>
            <th scope="col">Licence</th>
            <th scope="col">Source</th>
          </tr>
        </thead>
        <tbody>
          {SOUNDS.map((sound) => (
            <tr key={sound.id}>
              <th scope="row">{sound.name}</th>
              <td>{sound.artworkAuthor}</td>
              <td>{sound.artworkLicence}</td>
              <td>
                <a href={sound.artworkSource} target="_blank" rel="noreferrer">
                  {sound.name} picture on Wikimedia Commons
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
