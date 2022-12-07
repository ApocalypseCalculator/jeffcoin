package main

import (
	"fmt"
	"os"
	"strings"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/muesli/termenv"
)

var (
	color   = termenv.EnvColorProfile().Color
	keyword = termenv.Style{}.Foreground(color("204")).Background(color("235")).Styled
	help    = termenv.Style{}.Foreground(color("241")).Styled

	focusedStyle        = lipgloss.NewStyle().Foreground(lipgloss.Color("205"))
	blurredStyle        = lipgloss.NewStyle().Foreground(lipgloss.Color("240"))
	cursorStyle         = focusedStyle.Copy()
	noStyle             = lipgloss.NewStyle()
	helpStyle           = blurredStyle.Copy()
	cursorModeHelpStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("244"))

	focusedButton = focusedStyle.Copy().Render("[ Submit ]")
	blurredButton = fmt.Sprintf("[ %s ]", blurredStyle.Render("Submit"))
)

var choices_loggedin = []string{"About", "View Transactions", "View Blocks", "Mine Jeffcoin", "Play Keno", "Log Out"}
var choices_loggedout = []string{"About", "Log In"}

var choices = []string{}

type model struct {
	altscreen  bool
	mainpage   int
	cursor     int
	loaded     CacheData
	loggedin   bool
	inputs     []textinput.Model
	focusIndex int
	cursorMode textinput.CursorMode
}

/*
PAGE CODES (mainpage)
-1 MAIN MENU
0 ABOUT
1 VIEW TRANSACTIONS
2 VIEW BLOCKS
3 MINE JEFFCOIN
4 PLAY KENO
5 LOG OUT
50 LOG IN
*/

func (m model) Init() tea.Cmd {
	return nil
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "q", "ctrl+c":
			return m, tea.Quit
		case "esc":
			m.mainpage = -1
		/*case " ":
		var cmd tea.Cmd
		if m.altscreen {
			cmd = tea.ExitAltScreen
		} else {
			cmd = tea.EnterAltScreen
		}
		m.altscreen = !m.altscreen
		return m, cmd*/

		case "down", "s":
			m.cursor++
			if m.cursor >= len(choices) {
				m.cursor = 0
			}

		case "up", "w":
			m.cursor--
			if m.cursor < 0 {
				m.cursor = len(choices) - 1
			}

		case "enter":
			if m.mainpage == -1 {
				if !m.loggedin && m.cursor == 1 {
					m.mainpage = 50
				} else {
					m.mainpage = m.cursor
				}
			}
		}
	}
	return m, nil
}

func (m model) View() string {
	switch m.mainpage {
	case -1:
		{
			return mainMenu(m)
		}
	case 0:
		{
			return about(m)
		}
	case 50:
		{
			return login(m)
		}
	default:
		{
			const (
				altscreenMode = " altscreen mode "
				inlineMode    = " inline mode "
			)

			var mode string
			if m.altscreen {
				mode = altscreenMode
			} else {
				mode = inlineMode
			}
			return fmt.Sprintf("\n\n  You're in %s\n\n\n", keyword(mode)) +
				help("  space: switch modes • q: exit\n")
		}
	}
}

func mainMenu(m model) string {
	s := strings.Builder{}
	s.WriteString("\n\n  Welcome to jeffcoin!\n\n\n")

	for i := 0; i < len(choices); i++ {
		if m.cursor == i {
			s.WriteString(keyword(fmt.Sprintf("  > [%d] %s", i+1, choices[i])))
		} else {
			s.WriteString(fmt.Sprintf("    [%d] %s", i+1, choices[i]))
		}
		s.WriteString("\n")
	}
	s.WriteString("\n" + help("  (press q to quit)\n"))

	return s.String()
}

func about(m model) string {
	s := strings.Builder{}
	s.WriteString("\n\n  JEFFCOIN IS A CENTRALIZED CRYPTOCURRENCY\n\n\n")
	s.WriteString("\n  IT WAS CREATED AS A MERE HOBBY PROJECT AND IS IN NO WAY INTENDED TO BE AN ACTUAL MONETARY TRANSACTION PLATFORM\n\n\n\n")
	s.WriteString("\n  CREATED BY APOCALYPSECALCULATOR\n\n\n\n")
	return s.String()
}

func login(m model) string {
	var b strings.Builder

	for i := range m.inputs {
		b.WriteString(m.inputs[i].View())
		if i < len(m.inputs)-1 {
			b.WriteRune('\n')
		}
	}

	button := &blurredButton
	if m.focusIndex == len(m.inputs) {
		button = &focusedButton
	}
	fmt.Fprintf(&b, "\n\n%s\n\n", *button)

	b.WriteString(helpStyle.Render("cursor mode is "))
	b.WriteString(cursorModeHelpStyle.Render(m.cursorMode.String()))
	b.WriteString(helpStyle.Render(" (ctrl+r to change style)"))

	return b.String()
}

func main() {
	inputs := make([]textinput.Model, 3)

	var t textinput.Model
	for i := range inputs {
		t = textinput.New()
		t.CursorStyle = cursorStyle
		t.CharLimit = 32

		switch i {
		case 0:
			t.Placeholder = "Nickname"
			t.Focus()
			t.PromptStyle = focusedStyle
			t.TextStyle = focusedStyle
		case 1:
			t.Placeholder = "Email"
			t.CharLimit = 64
		case 2:
			t.Placeholder = "Password"
			t.EchoMode = textinput.EchoPassword
			t.EchoCharacter = '•'
		}

		inputs[i] = t
	}

	data, loggedin, _ := initialize()
	if loggedin {
		choices = choices_loggedin
	} else {
		choices = choices_loggedout
	}
	if _, err := tea.NewProgram(model{
		altscreen: true,
		mainpage:  -1,
		loaded:    data,
		loggedin:  loggedin,
		inputs:    inputs,
	}, tea.WithAltScreen()).Run(); err != nil {
		fmt.Println("Error running program:", err)
		os.Exit(1)
	}
}
