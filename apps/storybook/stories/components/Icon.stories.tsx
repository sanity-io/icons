import {Icon, icons, type IconSymbol} from '@sanity/icons'
import {Stack, Text} from '@sanity/ui'
import type {Meta, StoryObj} from '@storybook/react-vite'
import {expect, waitFor} from 'storybook/test'

function isIconSymbol(key: string): key is IconSymbol {
  return key in icons
}

const TEXT_SIZES = [0, 1, 2, 3, 4] as const

const meta: Meta<typeof Icon> = {
  args: {symbol: 'rocket'},
  argTypes: {
    symbol: {control: 'select', options: Object.keys(icons).filter(isIconSymbol)},
  },
  component: Icon,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Icon>

export const Default: Story = {
  render: (props) => <Icon style={{fontSize: 64}} {...props} />,
  play: async ({args, canvasElement}) => {
    // The Suspense fallback is an empty svg with the icon's shell, which the lazy icon
    // replaces with its drawing once its chunk has loaded
    await waitFor(async () => {
      const svg = canvasElement.querySelector(`svg[data-sanity-icon="${args.symbol}"]`)
      await expect(svg).toBeInTheDocument()
      await expect(svg).not.toBeEmptyDOMElement()
    })
  },
}

export const InText: Story = {
  render: (props) => (
    <Stack gap={4}>
      {TEXT_SIZES.map((size) => (
        <Text key={size} size={size}>
          <Icon {...props} /> Text size {size}
        </Text>
      ))}
    </Stack>
  ),
}
