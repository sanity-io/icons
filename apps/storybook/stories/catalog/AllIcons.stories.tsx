import {Icon, icons, type IconSymbol} from '@sanity/icons'
import {Card, Flex, Grid, Text} from '@sanity/ui'
import type {Meta, StoryObj} from '@storybook/react-vite'
import {expect, waitFor} from 'storybook/test'

function isIconSymbol(key: string): key is IconSymbol {
  return key in icons
}

const symbols = Object.keys(icons).filter(isIconSymbol)

function AllIcons({filter}: {filter: string}) {
  const query = filter.trim().toLowerCase()

  return (
    <Grid gap={2} gridTemplateColumns={[2, 3, 4, 6]}>
      {symbols
        .filter((symbol) => symbol.includes(query))
        .map((symbol) => (
          <Card key={symbol} border padding={3} radius={2}>
            <Flex align="center" direction="column" gap={3}>
              <Text size={4}>
                <Icon symbol={symbol} />
              </Text>
              <Text muted size={1}>
                {symbol}
              </Text>
            </Flex>
          </Card>
        ))}
    </Grid>
  )
}

const meta: Meta<typeof AllIcons> = {
  args: {filter: ''},
  component: AllIcons,
}

export default meta
type Story = StoryObj<typeof AllIcons>

export const Default: Story = {
  play: async ({canvasElement}) => {
    // Every entry in the lazy `icons` map loads its own chunk and draws its svg
    await waitFor(
      async () => {
        const svgs = [...canvasElement.querySelectorAll('svg[data-sanity-icon]')]
        await expect(svgs).toHaveLength(symbols.length)
        await expect(svgs.filter((svg) => svg.childElementCount === 0)).toEqual([])
      },
      {timeout: 30_000},
    )
  },
}
