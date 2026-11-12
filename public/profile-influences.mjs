const kinds = {
  book: 'Book',
  tv: 'TV show',
  movie: 'Film',
  song: 'Song',
  art: 'Artwork',
  podcast: 'Podcast',
};

const audience = 'Visible to everyone signed in to P4A.';

function influenceList(entries, e, actionButton) {
  if (!entries.length) return '<p class="muted profile-influences-empty">No works added yet.</p>';

  return `<ul class="profile-influences-list">${entries.map(entry => `<li class="profile-influence">
    <div class="profile-influence-description">
      <span class="chip">${e(kinds[entry.kind])}</span>
      <h3>${e(entry.title)}</h3>
      <p>${e(entry.note)}</p>
    </div>
    ${actionButton ? `<div class="button-row profile-influence-actions">
      ${actionButton('Edit', 'influence-edit', entry.id, 'secondary', `aria-label="Edit ${e(entry.title)}"`)}
      ${actionButton('Remove', 'influence-remove', entry.id, 'quiet', `aria-label="Remove ${e(entry.title)}"`)}
    </div>` : ''}
  </li>`).join('')}</ul>`;
}

export function myInfluences(entries, { e, actionButton }) {
  return `<section class="panel profile-influences" aria-labelledby="profile-influences-heading">
    <div class="profile-influences-header">
      <div><h2 id="profile-influences-heading">Works that shaped me</h2>
      <p>Share a book, TV show, film, song, artwork or podcast that shaped you or helps explain how you see things now.</p></div>
      ${actionButton('Add a work', 'influence-add', '', '')}
    </div>
    <p class="muted">${audience}</p>
    ${influenceList(entries, e, actionButton)}
  </section>`;
}

export function memberInfluences(profile, { e, heading }) {
  return `<div class="member-influences-page">
    <a class="button quiet profile-influences-back" href="#people">← Back to people</a>
    ${heading('Member profile', profile.name, audience)}
    <section class="panel profile-influences" aria-labelledby="profile-influences-heading">
      <h2 id="profile-influences-heading">Works that shaped me</h2>
      ${influenceList(profile.influences, e)}
    </section>
  </div>`;
}

export function influenceFields(entry, { e, field }) {
  return `<label class="field full">Type of work<select name="kind" required>
      <option value="" disabled${entry ? '' : ' selected'}>Choose a type</option>
      ${Object.entries(kinds).map(([value, label]) => `<option value="${value}"${entry?.kind === value ? ' selected' : ''}>${label}</option>`).join('')}
    </select></label>
    ${field('Title', 'title', entry?.title || '', { full: true, required: true, length: 140 })}
    <label class="field full">Why does it matter to you?
      <textarea name="note" rows="4" required maxlength="600" aria-describedby="influence-note-help">${e(entry?.note || '')}</textarea>
      <small id="influence-note-help">Tell teammates about a time it shaped you, or what it says about your perspective today.</small>
    </label>`;
}
