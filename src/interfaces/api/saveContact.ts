export type SaveContactCardData = {
  name: string
  email: string
  phone: string
  company: string
  profession: string
  gender: string
  website: string
  slug: string
  profileUrl: string
  imageUrl: string
  imageUrls?: string[]
  /** Free-form note / about text from the card owner. */
  note?: string
  /** Formatted location / address for ADR. */
  address?: string
}

export type SaveContactResponse = {
  success: boolean
  data: {
    action_buttons: {
      save_contact: {
        enabled: boolean
        label: string
        icon: string
        data: SaveContactCardData
        background_color: string
        text_color: string
      }
    }
  }
}
