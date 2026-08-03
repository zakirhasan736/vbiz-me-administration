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
