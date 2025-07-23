import { Component } from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import { Tooltip } from "@mui/material";
import "i18n";
import Swal from "sweetalert2";
// Launcher main style sheet
import "styles/Launcher.css";
import { withRouter } from "utils/withRouter";
import { NavigateFunction } from "react-router-dom";

const versions = ["1.20.1", "1.19.4", "1.18.2", "1.16.5"];

type State = {
  playerName: string;
  playerUuid: string;
  playersCount: string;
  serverStatus: string;
  version: string;
};

type Props = {
  navigate?: NavigateFunction;
};

class Launcher extends Component<Props & WithTranslation, State> {
  state = {
    playerName: "",
    playerUuid: "",
    playersCount: "",
    serverStatus: "offline",
    version: "1.20.1",
  };

  componentDidMount() {
    window.ipc.send("ping-server");
    window.ipc.receive("ping-server-result", (res) => {
      if (res) {
        this.setState({
          serverStatus: "online",
          playersCount: res.players.online + "/" + res.players.max,
        });
      } else {
        this.setState({ serverStatus: "offline", playersCount: "0" });
      }
    });
    this.setState({
      playerName: window.ipc.sendSync("get-player-name"),
      playerUuid: window.ipc.sendSync("get-player-uuid"),
    });
    setInterval(() => window.ipc.send("ping-server"), 30000);
  }

  handleOpenExternalLink(value: string) {
    const config = window.ipc.sendSync("get-dynamic-config");
    if (config) {
      let linkToOpen = "";
      switch (value) {
        case "twitter":
          linkToOpen = config.twitter;
          break;
        case "youtube":
          linkToOpen = config.youtube;
          break;
        case "discord":
          linkToOpen = config.discord;
          break;
        default:
          linkToOpen = "";
          break;
      }
      if (linkToOpen) {
        window.ipc.send("open-link", linkToOpen);
      }
    }
  }

  //Arrow fx for binding
  handlePlay = () => {
    const { t } = this.props;
    const { playerName, version } = this.state;
    const config = window.ipc.sendSync("get-dynamic-config");
    if (config.maintenance) {
      Swal.fire({
        title: t("launcher.maintenance"),
        html: `<p style="color: white;">${config.maintenanceMessage}</p>`,
        icon: "warning",
        confirmButtonColor: "#54c2f0",
        background: "#333",
      });
      return;
    }

    const javaPath = window.ipc.sendSync("get-java-path");
    if (!javaPath) {
      Swal.fire({
        title: t("error"),
        text: t("settings.java-missing"),
        icon: "error",
        confirmButtonColor: "#54c2f0",
        background: "#333",
      });
      return;
    }

    const javaValid = window.ipc.sendSync("is-java-valid");
    if (!javaValid) {
      Swal.fire({
        title: t("error"),
        text: t("settings.java-missing"),
        icon: "error",
        confirmButtonColor: "#54c2f0",
        background: "#333",
      }).then(() => {
        window.ipc.send("open-java-dialog");
      });
      return;
    }

    window.ipc.send("play-version", { username: playerName, version });
  };
  getNews() {
    const config = window.ipc.sendSync("get-dynamic-config");
    return config.news;
  }

  render() {
    const { t } = this.props;
    const { playerUuid, playerName, playersCount, serverStatus } = this.state;
    return (
      <div className="launcher-content">
        <img src={`assets/logo.png`} alt="logo" />
        <div className="player-box">
          <div className="head-box">
            <img
              src={`https://mc-heads.net/avatar/${playerUuid}/50`}
              alt="player-head"
              className="player-head"
            />
          </div>
          <p>{playerName}</p>
        </div>
        <div className="play-content">
          <div className="server-infos">
            <p className="server-status">
              {t("launcher.server-status")}:{" "}
              <span
                className="server-status-indicator"
                style={{
                  backgroundColor:
                    serverStatus === "online" ? "#2AE91D" : "red",
                }}
              />
            </p>
            <p className="players">
              {t("launcher.players")}: <span>{playersCount}</span>
            </p>
          </div>
          <div className="play-box">
            <div className="version-selector">
              <select
                value={this.state.version}
                onChange={(e) => this.setState({ version: e.target.value })}
              >
                {versions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <button className="play-button" onClick={this.handlePlay}>
              {t("launcher.play")}
            </button>
            <button
              className="settings-button"
              // @ts-ignore: Cannot invoke an object which is possibly 'undefined'
              onClick={() => this.props.navigate("/settings")}
            >
              <i className="fas fa-cog"></i>
            </button>
          </div>
        </div>

        <div className="external-links">
          <Tooltip title="Discord" placement="top">
            <div
              className="external-link"
              onClick={() => this.handleOpenExternalLink("discord")}
            >
              <img
                src={`assets/discord.png`}
                alt="discord"
                className="external-link-img"
              />
            </div>
          </Tooltip>
          <Tooltip title="Twitter" placement="top">
            <div
              className="external-link"
              onClick={() => this.handleOpenExternalLink("twitter")}
            >
              <img
                src={`assets/twitter.png`}
                alt="twitter"
                className="external-link-img"
              />
            </div>
          </Tooltip>
          <Tooltip title="Youtube" placement="top">
            <div
              className="external-link"
              onClick={() => this.handleOpenExternalLink("youtube")}
            >
              <img
                src={`assets/youtube.png`}
                alt="youtube"
                className="external-link-img"
              />
            </div>
          </Tooltip>
        </div>
        <div className="news-box">
          <h3>{t("launcher.news")}</h3>
          <p>{this.getNews()}</p>
        </div>
      </div>
    );
  }
}

export default withTranslation()(withRouter<Props & WithTranslation>(Launcher));
