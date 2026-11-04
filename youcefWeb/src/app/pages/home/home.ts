import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n, TrPipe } from '../../core/i18n';

@Component({
  selector: 'app-home',
  imports: [RouterLink, TrPipe],
  template: `
    <!-- HERO -->
    <section class="hero">
      <div class="conteneur hero-grille">
        <div class="hero-texte">
          <span class="sur-titre">{{ 'Coaching en développement personnel · 100 % visio' | tr: 'Personal development coaching · 100% online' }}</span>
          <h1>{{ 'Retrouvez votre équilibre.' | tr: 'Find your balance.' }} <em>{{ 'Reprenez votre place.' | tr: 'Take your place back.' }}</em></h1>
          <p class="chapeau">
            {{ 'Je vous accompagne à mieux vous comprendre pour faire des choix alignés avec votre identité profonde, vos valeurs et vos aspirations.' | tr: 'I help you understand yourself better so you can make choices aligned with your deepest identity, your values and your aspirations.' }}
          </p>
          <div class="actions">
            <a routerLink="/devis" class="btn">{{ 'Demander un devis' | tr: 'Request a quote' }}</a>
            <a routerLink="/" fragment="accompagnements" class="btn secondaire">{{ 'Découvrir les accompagnements' | tr: 'Discover the programmes' }}</a>
          </div>
        </div>
        <div class="hero-visuel" aria-hidden="true">
          <div class="halo"></div>
          <span class="logo"></span>
        </div>
      </div>
    </section>

    <!-- BANDEAU DE CONFIANCE -->
    <section class="confiance">
      <div class="conteneur confiance-grille">
        @for (c of confiance; track $index) {
          <div>
            <strong>{{ c.titre() }}</strong>
            <span>{{ c.texte() }}</span>
          </div>
        }
      </div>
    </section>

    <!-- APPROCHE -->
    <section id="approche" class="bloc">
      <div class="conteneur">
        <div class="entete">
          <span class="sur-titre">{{ 'Mon approche' | tr: 'My approach' }}</span>
          <h2>{{ 'Un accompagnement sur mesure,' | tr: 'Tailor-made support,' }} <em>{{ 'sans filtre' | tr: 'no filter' }}</em></h2>
          <p>
            {{ 'Surmonter vos blocages profonds, retrouver un équilibre et vous réaliser pleinement, sur le plan personnel comme professionnel. Voici ce que nous construisons ensemble.' | tr: 'Overcome deep-seated blocks, regain your balance and fulfil your potential, both personally and professionally. Here is what we build together.' }}
          </p>
        </div>
        <div class="roles">
          @for (r of roles; track $index; let i = $index) {
            <article class="carte role">
              <span class="numero">0{{ i + 1 }}</span>
              <h3>{{ r.titre() }}</h3>
              <p>{{ r.texte() }}</p>
            </article>
          }
        </div>
      </div>
    </section>

    <!-- POUR QUI -->
    <section class="citation">
      <div class="conteneur citation-grille">
        <blockquote>
          {{ '« Vous n\\'avez pas besoin d\\'aller mal pour vouloir aller mieux. Il suffit d\\'avoir envie de vous retrouver. »' | tr: '“You don\\'t have to be struggling to want to feel better. All it takes is the desire to find yourself again.”' }}
        </blockquote>
        <div>
          <span class="sur-titre">{{ 'Pour qui ?' | tr: 'Who is it for?' }}</span>
          <p>
            {{ 'Pour toute personne en quête de sens, quel que soit son parcours ou sa situation. Beaucoup de celles et ceux que j\\'accompagne doutent de leur valeur et ont du mal à s\\'attribuer le mérite de ce qu\\'ils accomplissent : une réussite est mise sur le compte de la chance, un échec sur le compte de leur personne.' | tr: 'For anyone searching for meaning, whatever their background or situation. Many of the people I work with doubt their worth and struggle to take credit for what they achieve: a success is put down to luck, a failure to who they are.' }}
          </p>
          <p>{{ 'Ensemble, nous remettons les choses à leur juste place.' | tr: 'Together, we put things back in their rightful place.' }}</p>
        </div>
      </div>
    </section>

    <!-- ACCOMPAGNEMENTS -->
    <section id="accompagnements" class="bloc">
      <div class="conteneur">
        <div class="entete centre">
          <span class="sur-titre">{{ 'Les accompagnements' | tr: 'The programmes' }}</span>
          <h2>{{ 'Trois formules,' | tr: 'Three programmes,' }} <em>{{ 'un même engagement' | tr: 'one shared commitment' }}</em></h2>
          <p>{{ 'Suivi de trois mois minimum, séances en visio uniquement. Tarif communiqué sur demande.' | tr: 'A minimum of three months of support, online sessions only. Pricing available on request.' }}</p>
        </div>
        <div class="offres">
          @for (o of offres; track o.cle) {
            <article class="offre" [class.vedette]="o.vedette">
              @if (o.vedette) {
                <span class="ruban">{{ 'Le plus complet' | tr: 'Most comprehensive' }}</span>
              }
              <span class="duree">{{ o.duree() }}</span>
              <h3>{{ o.titre() }}</h3>
              <p class="resume">{{ o.resume() }}</p>
              <ul>
                @for (p of o.points(); track $index) {
                  <li>{{ p }}</li>
                }
              </ul>
              <a routerLink="/devis" [queryParams]="{ formule: o.cle }" class="btn" [class.secondaire]="!o.vedette" [class.clair]="o.vedette">
                {{ 'Demander un devis' | tr: 'Request a quote' }}
              </a>
            </article>
          }
        </div>
      </div>
    </section>

    <!-- PARCOURS -->
    <section id="parcours" class="bloc parcours">
      <div class="conteneur">
        <div class="entete centre">
          <span class="sur-titre">{{ 'Le parcours' | tr: 'The journey' }}</span>
          <h2>{{ 'Simple,' | tr: 'Simple,' }} <em>{{ 'du premier échange' | tr: 'from the first conversation' }}</em> {{ 'au suivi' | tr: 'to ongoing support' }}</h2>
        </div>
        <ol class="etapes">
          @for (e of etapes; track $index; let i = $index) {
            <li>
              <span class="pastille">{{ i + 1 }}</span>
              <h3>{{ e.titre() }}</h3>
              <p>{{ e.texte() }}</p>
            </li>
          }
        </ol>
      </div>
    </section>

    <!-- APPEL FINAL -->
    <section class="final">
      <div class="conteneur">
        <h2>{{ 'Prêt à vous retrouver ?' | tr: 'Ready to find yourself again?' }}</h2>
        <p>{{ 'Le premier pas, c\\'est simplement de me dire ce qui vous amène.' | tr: 'The first step is simply to tell me what brings you here.' }}</p>
        <a routerLink="/login" class="btn clair">{{ 'Accéder à mon espace' | tr: 'Access my account' }}</a>
      </div>
    </section>
  `,
  styles: `
    :host { display: block; }

    /* Hero */
    .hero {
      position: relative;
      overflow: hidden;
      background:
        radial-gradient(900px 500px at 85% 10%, rgba(208, 231, 245, 0.7), transparent 60%),
        radial-gradient(700px 500px at 0% 100%, rgba(217, 201, 180, 0.55), transparent 60%),
        var(--ivoire);
      padding: 5rem 0 6rem;
    }
    .hero-grille {
      display: grid;
      grid-template-columns: 1.25fr 1fr;
      align-items: center;
      gap: 3rem;
    }
    .hero-grille > *, .citation-grille > * { min-width: 0; }
    .hero-texte > * { animation: monte 0.8s both; }
    .hero-texte > :nth-child(2) { animation-delay: 0.08s; }
    .hero-texte > :nth-child(3) { animation-delay: 0.16s; }
    .hero-texte > :nth-child(4) { animation-delay: 0.24s; }
    .chapeau { font-size: 1.2rem; color: var(--texte-doux); max-width: 34rem; margin-block: 1.4rem 2.2rem; }
    .actions { display: flex; flex-wrap: wrap; gap: 0.9rem; }
    .hero-visuel {
      position: relative;
      display: grid;
      place-items: center;
      animation: monte 1s 0.2s both;
    }
    .hero-visuel .logo {
      position: relative;
      width: min(100%, 380px);
      box-shadow: var(--ombre-forte), 0 0 0 10px rgba(255, 255, 255, 0.55), 0 0 0 11px var(--champagne);
    }
    .halo {
      position: absolute;
      width: 115%;
      aspect-ratio: 1;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(108, 174, 214, 0.35), transparent 65%);
    }

    /* Bandeau confiance */
    .confiance { background: var(--bleu-profond); color: var(--ivoire-clair); }
    .confiance-grille {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
      padding-block: 1.8rem;
    }
    .confiance strong {
      display: block;
      font-family: var(--serif);
      font-size: 1.5rem;
      color: var(--bleu-diamant);
    }
    .confiance span { font-size: 0.88rem; opacity: 0.75; }

    /* Sections */
    .bloc { padding: 6rem 0; }
    .entete { max-width: 40rem; margin-bottom: 3rem; }
    .entete p { color: var(--texte-doux); font-size: 1.1rem; }
    .entete.centre { max-width: 48rem; margin-inline: auto; text-align: center; }

    .roles {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.4rem;
    }
    .role {
      transition: transform 0.25s, box-shadow 0.25s;
      &:hover { transform: translateY(-6px); box-shadow: var(--ombre-forte); }
      h3 { font-size: 1.45rem; }
      p { margin: 0; color: var(--texte-doux); font-size: 0.95rem; }
    }
    .numero {
      display: block;
      margin-bottom: 1rem;
      font-family: var(--serif);
      font-size: 2.6rem;
      line-height: 1;
      color: var(--bleu-clair);
    }

    /* Citation */
    .citation { background: var(--bleu-diamant); padding: 5rem 0; }
    .citation-grille {
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      gap: 4rem;
      align-items: center;
    }
    blockquote {
      margin: 0;
      font-family: var(--serif);
      font-size: clamp(1.7rem, 3vw, 2.5rem);
      font-style: italic;
      line-height: 1.25;
      color: var(--bleu-profond);
      padding-left: 1.5rem;
      border-left: 3px solid var(--champagne-fonce);
    }
    .citation p { color: var(--texte); }

    /* Offres */
    .offres {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.6rem;
      align-items: stretch;
    }
    .offre {
      position: relative;
      display: flex;
      flex-direction: column;
      padding: 2.2rem 2rem;
      background: var(--blanc);
      border: 1px solid rgba(10, 29, 53, 0.08);
      border-radius: 24px;
      box-shadow: var(--ombre);
      transition: transform 0.25s, box-shadow 0.25s;

      &:hover { transform: translateY(-6px); box-shadow: var(--ombre-forte); }
      h3 { font-size: 1.9rem; margin-bottom: 0.4rem; }
      .resume { color: var(--texte-doux); }
      ul { list-style: none; padding: 0; margin: 0 0 2rem; flex: 1; }
      li {
        position: relative;
        padding: 0.5rem 0 0.5rem 1.7rem;
        border-top: 1px solid rgba(10, 29, 53, 0.07);
        font-size: 0.95rem;

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 1rem;
          width: 0.55rem;
          height: 0.55rem;
          background: var(--bleu-clair);
          transform: rotate(45deg);
        }
      }
      &.vedette {
        background: var(--bleu-profond);
        color: var(--ivoire-clair);
        transform: translateY(-14px);
        box-shadow: var(--ombre-forte);
        h3 { color: var(--ivoire-clair); }
        .resume { color: rgba(250, 246, 240, 0.7); }
        .duree { color: var(--champagne); }
        li { border-color: rgba(250, 246, 240, 0.14); &::before { background: var(--champagne); } }
        &:hover { transform: translateY(-20px); }
      }
    }
    .duree {
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--champagne-fonce);
      margin-bottom: 0.8rem;
    }
    .ruban {
      position: absolute;
      top: -0.8rem;
      left: 50%;
      transform: translateX(-50%);
      padding: 0.3rem 1rem;
      border-radius: 999px;
      background: var(--champagne);
      color: var(--bleu-profond);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    /* Parcours */
    .parcours { background: var(--ivoire); }
    .etapes {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 2rem;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        top: 1.6rem;
        left: 12%;
        right: 12%;
        border-top: 1.5px dashed var(--champagne-fonce);
      }
      li { position: relative; text-align: center; }
      h3 { font-size: 1.35rem; }
      p { color: var(--texte-doux); font-size: 0.93rem; margin: 0; }
    }
    .pastille {
      position: relative;
      display: grid;
      place-items: center;
      width: 3.2rem;
      height: 3.2rem;
      margin: 0 auto 1.2rem;
      border-radius: 50%;
      background: var(--bleu-profond);
      color: var(--ivoire-clair);
      font-family: var(--serif);
      font-size: 1.5rem;
      font-weight: 700;
      box-shadow: 0 0 0 6px var(--ivoire);
    }

    /* Appel final */
    .final {
      text-align: center;
      padding: 6rem 0;
      background: linear-gradient(135deg, var(--bleu-profond), var(--bleu-nuit));
      color: var(--ivoire-clair);
      h2 { color: var(--ivoire-clair); }
      p { opacity: 0.8; font-size: 1.1rem; margin-bottom: 2rem; }
    }

    @media (max-width: 900px) {
      .hero { padding: 3rem 0 4rem; }
      .hero-grille, .citation-grille { grid-template-columns: 1fr; }
      .hero-visuel { order: -1; .logo { width: 220px; } }
      .confiance-grille { grid-template-columns: repeat(2, 1fr); }
      .offres { grid-template-columns: 1fr; }
      .offre.vedette { transform: none; &:hover { transform: translateY(-6px); } }
      .etapes { grid-template-columns: 1fr 1fr; &::before { display: none; } }
      .bloc { padding: 4rem 0; }
    }
    @media (max-width: 520px) {
      .etapes { grid-template-columns: 1fr; }
    }
  `,
})
export class Home {
  private readonly i18n = inject(I18n);

  private tx(fr: string, en: string) {
    return computed(() => this.i18n.t(fr, en));
  }

  protected readonly confiance = [
    { titre: this.tx('100 % visio', '100% online'), texte: this.tx('Où que vous soyez', 'Wherever you are') },
    { titre: this.tx('3 mois minimum', '3 months minimum'), texte: this.tx('Un vrai suivi dans la durée', 'Genuine long-term support') },
    { titre: this.tx('1 séance / semaine', '1 session / week'), texte: this.tx('Un rythme régulier', 'A steady rhythm') },
    { titre: this.tx('Confidentiel', 'Confidential'), texte: this.tx('Un espace personnel sécurisé', 'A secure personal space') },
  ];

  protected readonly roles = [
    {
      titre: this.tx('Faire taire le critique intérieur', 'Silence your inner critic'),
      texte: this.tx('Ce petit juge qui vous maintient au sol perd peu à peu de son pouvoir.', 'That little judge keeping you down gradually loses its power.'),
    },
    {
      titre: this.tx('Reconstruire votre estime de vous', 'Rebuild your self-esteem'),
      texte: this.tx('Une estime solide et inébranlable, qui ne dépend plus du regard des autres.', 'Solid, unshakeable self-esteem that no longer depends on how others see you.'),
    },
    {
      titre: this.tx('Vous libérer de la pression sociale', 'Free yourself from social pressure'),
      texte: this.tx('Déposer le poids des attentes pour choisir ce qui compte vraiment pour vous.', 'Put down the weight of expectations and choose what truly matters to you.'),
    },
    {
      titre: this.tx('Vous reconnecter à qui vous êtes', 'Reconnect with who you are'),
      texte: this.tx('Retrouver votre identité profonde, vos valeurs et vos aspirations, sans filtre.', 'Rediscover your deepest identity, your values and your aspirations, unfiltered.'),
    },
  ];

  protected readonly offres = [
    {
      cle: 'Accompagnement ciblé',
      duree: this.tx('3 mois', '3 months'),
      titre: this.tx('Accompagnement ciblé', 'Targeted programme'),
      resume: this.tx('Pour traiter deux problématiques précises.', 'To work through two specific issues.'),
      points: computed(() => [
        this.i18n.t('10 à 12 séances en visio', '10 to 12 online sessions'),
        this.i18n.t('Deux problématiques travaillées', 'Two issues worked on'),
        this.i18n.t('Souvent, l\'essentiel se joue en 4 à 5 séances', 'Often, the essential work happens in 4 to 5 sessions'),
      ]),
      vedette: false,
    },
    {
      cle: 'Accompagnement approfondi',
      duree: this.tx('6 mois', '6 months'),
      titre: this.tx('Accompagnement approfondi', 'In-depth programme'),
      resume: this.tx('Pour avancer en profondeur sur plusieurs sujets.', 'To make deep progress on several topics.'),
      points: computed(() => [
        this.i18n.t('Un rendez-vous par semaine en visio', 'One online appointment per week'),
        this.i18n.t('Plusieurs problématiques travaillées', 'Several issues worked on'),
        this.i18n.t('Un suivi sur la durée, documents à disposition', 'Long-term follow-up, with documents provided'),
      ]),
      vedette: true,
    },
    {
      cle: 'Bootcamp à l\'étranger',
      duree: this.tx('1 semaine', '1 week'),
      titre: this.tx('Bootcamp à l\'étranger', 'Bootcamp abroad'),
      resume: this.tx('Une immersion pour un grand reset.', 'An immersion for a complete reset.'),
      points: computed(() => [
        this.i18n.t('Une semaine intensive à l\'étranger', 'An intensive week abroad'),
        this.i18n.t('Un cadre dépaysant, loin du quotidien', 'A change of scenery, away from daily life'),
        this.i18n.t('Un accompagnement concentré', 'Focused, concentrated support'),
      ]),
      vedette: false,
    },
  ];

  protected readonly etapes = [
    { titre: this.tx('Je demande un devis', 'I request a quote'), texte: this.tx('J\'indique la formule et ce qui m\'amène.', 'I choose a programme and tell you what brings me here.') },
    { titre: this.tx('Youcef me répond', 'Youcef replies'), texte: this.tx('Il étudie ma demande et me propose un créneau en visio.', 'He reviews my request and offers me a video session slot.') },
    { titre: this.tx('Je reçois mon accès', 'I receive my access'), texte: this.tx('Youcef crée mon espace personnel et sécurisé.', 'Youcef creates my personal, secure space.') },
    { titre: this.tx('Je suis accompagné', 'I am supported'), texte: this.tx('Séances chaque semaine, documents et comptes rendus dans mon espace.', 'Weekly sessions, with documents and session notes in my space.') },
  ];
}
