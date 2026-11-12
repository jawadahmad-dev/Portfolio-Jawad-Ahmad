export interface ProjectsModel {
  id?: string;
  title: string;
  description: string;
  technologies: string;
  liveLink?: string;
  githubLink: string;
  /** Base64 image data URLs. The first one is the cover. */
  images: string[];
  /** Old single image link. Only present on projects saved before multiple images were supported. */
  image?: string;
}
